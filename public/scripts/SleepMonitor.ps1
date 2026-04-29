Add-Type @"
using System.Runtime.InteropServices;
public class Monitor {
    [DllImport("user32.dll")]
    public static extern int SendMessage(int hWnd, int hMsg, int wParam, int lParam);
}
"@
[void] [Monitor]::SendMessage(-1, 0x0112, 0xF170, 2)
