// Demo de consola – Unidad III: Programación concurrente
// Ejecutar con: dotnet run   (elija la demo 1–4)

Console.OutputEncoding = System.Text.Encoding.UTF8;
Console.WriteLine("""
    1) Estados de un hilo
    2) Condición de carrera y lock
    3) SemaphoreSlim: máximo 2 tareas a la vez
    4) Detención controlada con CancellationToken
    """);
Console.Write("Opción: ");
switch (Console.ReadLine())
{
    case "1": EstadosDeUnHilo(); break;
    case "2": CondicionDeCarrera(); break;
    case "3": await Semaforo(); break;
    case "4": await DetencionControlada(); break;
    default: Console.WriteLine("Opción no válida."); break;
}

// 1. Un Thread pasa por Unstarted → Running → WaitSleepJoin → Stopped
static void EstadosDeUnHilo()
{
    var hilo = new Thread(() =>
    {
        Console.WriteLine($"  [trabajador] id={Environment.CurrentManagedThreadId} trabajando…");
        Thread.Sleep(1500); // mientras duerme: WaitSleepJoin
    }) { Name = "Trabajador", IsBackground = false };

    Console.WriteLine($"Antes de Start: {hilo.ThreadState}");
    hilo.Start();
    Thread.Sleep(200);
    Console.WriteLine($"Durante Sleep:  {hilo.ThreadState}");
    hilo.Join();   // el hilo principal espera a que termine
    Console.WriteLine($"Después de Join: {hilo.ThreadState}");
}

// 2. Dos hilos incrementan el mismo contador: sin sincronización se pierden incrementos
static void CondicionDeCarrera()
{
    const int N = 1_000_000;
    int sinLock = 0, conLock = 0, interlocked = 0;
    object candado = new();

    void Trabajo()
    {
        for (int i = 0; i < N; i++)
        {
            sinLock++;                               // lectura-modificación-escritura NO atómica
            lock (candado) { conLock++; }            // sección crítica (Monitor)
            Interlocked.Increment(ref interlocked);  // operación atómica del procesador
        }
    }

    var a = new Thread(Trabajo); var b = new Thread(Trabajo);
    a.Start(); b.Start(); a.Join(); b.Join();
    Console.WriteLine($"Esperado:     {2 * N:N0}");
    Console.WriteLine($"Sin lock:     {sinLock:N0}   ← normalmente menor");
    Console.WriteLine($"Con lock:     {conLock:N0}");
    Console.WriteLine($"Interlocked:  {interlocked:N0}");
}

// 3. SemaphoreSlim limita cuántas tareas entran a la vez (p. ej., descargas simultáneas)
static async Task Semaforo()
{
    using var semaforo = new SemaphoreSlim(2);
    var tareas = Enumerable.Range(1, 6).Select(async n =>
    {
        await semaforo.WaitAsync();
        try
        {
            Console.WriteLine($"{DateTime.Now:HH:mm:ss.f}  entra tarea {n}");
            await Task.Delay(1000);
            Console.WriteLine($"{DateTime.Now:HH:mm:ss.f}  sale  tarea {n}");
        }
        finally { semaforo.Release(); }
    });
    await Task.WhenAll(tareas);
}

// 4. El hilo revisa el token y termina limpio; nunca se usa Thread.Abort (obsoleto)
static async Task DetencionControlada()
{
    using var cts = new CancellationTokenSource();
    var tarea = Task.Run(async () =>
    {
        int n = 0;
        while (!cts.Token.IsCancellationRequested)
        {
            Console.WriteLine($"  procesando lote {++n}…");
            await Task.Delay(400);
        }
        Console.WriteLine("  tarea: recibí la cancelación, libero recursos y salgo.");
    });
    Console.WriteLine("Pulse ENTER para detener…");
    Console.ReadLine();
    cts.Cancel();
    await tarea;
    Console.WriteLine($"Estado final de la tarea: {tarea.Status}");
}
