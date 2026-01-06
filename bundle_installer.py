import os
import requests
import subprocess
import shutil
import glob
from pathlib import Path

# CONFIG
READEST_REPO = "readest/readest"
CAMBRIDGE_DIR = Path("cambridge-gui").resolve()
DIST_DIR = Path("dist_suite").resolve()
INNO_SCRIPT = DIST_DIR / "suite_setup.iss"

def step(msg):
    print(f"\n[+] {msg}")

def download_latest_readest():
    step(f"Fetching latest Readest release from {READEST_REPO}...")
    api_url = f"https://api.github.com/repos/{READEST_REPO}/releases/latest"
    
    try:
        resp = requests.get(api_url, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        
        assets = data.get("assets", [])
        installer_asset = next((a for a in assets if a["name"].endswith(".exe") and "setup" in a["name"].lower()), None)
        
        if not installer_asset:
            installer_asset = next((a for a in assets if a["name"].endswith(".exe")), None)
            
        if not installer_asset:
            print("[-] No .exe installer found in latest release.")
            return None
            
        download_url = installer_asset["browser_download_url"]
        filename = "ReadestSetup.exe" # Normalize name
        dest_path = DIST_DIR / filename
        
        # Check size or exist
        if dest_path.exists():
            print(f"[*] {filename} already exists. Skipping download.")
            return dest_path
            
        step(f"Downloading {filename}...")
        with requests.get(download_url, stream=True) as r:
            r.raise_for_status()
            with open(dest_path, 'wb') as f:
                for chunk in r.iter_content(chunk_size=8192):
                    f.write(chunk)
        
        return dest_path
        
    except Exception as e:
        print(f"[-] Failed to download Readest: {e}")
        return None

def build_cambridge():
    step("Building Cambridge App (Tauri)...")
    try:
        # Check for nsis/msi locally first to avoid rebuild if recently built
        # But user wants fresh build? Let's rebuild to be safe or check timestamp.
        cmd = "npm run tauri build"
        subprocess.run(cmd, cwd=CAMBRIDGE_DIR, shell=True, check=True)
        
        target_dir = CAMBRIDGE_DIR / "src-tauri" / "target" / "release" / "bundle" / "nsis"
        installers = list(target_dir.glob("*.exe"))
        
        if not installers:
            print("[-] Could not locate Cambridge installer artifact (NSIS).")
            return None
            
        latest = max(installers, key=os.path.getctime)
        return latest
        
    except subprocess.CalledProcessError as e:
        print(f"[-] Build Failed: {e}")
        return None

def generate_inno_script(cambridge_exe, readest_exe):
    step("Generating Inno Setup Script...")
    
    # We need to extract the raw files from Cambridge? 
    # NO, we can just bundle the Cambridge Installer and run it silently?
    # Better: Bundle the Cambridge Installer EXE and the Readest Installer EXE.
    # And the setup runs them one by one.
    # This is a "Wrapper Installer".
    
    script = f"""
[Setup]
AppName=Cambridge Reader Suite
AppVersion=1.0
DefaultDirName={{autopf}}\\CambridgeReader
DisableDirPage=yes
OutputBaseFilename=CambridgeSetup_v1
Compression=lzma2
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=lowest
Uninstallable=no
InfoBeforeFile=

[Files]
; Embed the installers
Source: "{cambridge_exe.name}"; DestDir: "{{tmp}}"; Flags: deleteafterinstall
Source: "{readest_exe.name}"; DestDir: "{{tmp}}"; Flags: deleteafterinstall

[Run]
; Run Readest Installer (Blocking or NoWait?)
; Ideally silent. Assuming NSIS/Inno args. 
Filename: "{{tmp}}\\{readest_exe.name}"; StatusMsg: "Installing Readest Reader..."; Parameters: "/SILENT"; Flags: waituntilterminated
; Run Cambridge Installer
Filename: "{{tmp}}\\{cambridge_exe.name}"; StatusMsg: "Installing Cambridge Library..."; Parameters: "/SILENT"; Flags: waituntilterminated

[Messages]
SetupWindowTitle=Cambridge Reader - Full Suite Setup
"""
    with open(INNO_SCRIPT, "w") as f:
        f.write(script)
    return INNO_SCRIPT

def compile_inno(script_path):
    step("Compiling with Inno Setup...")
    # Try to find ISCC
    iscc = "iscc"
    # Common paths
    paths = [
        r"C:\Program Files (x86)\Inno Setup 6\ISCC.exe",
        r"C:\Program Files\Inno Setup 6\ISCC.exe",
        shutil.which("iscc")
    ]
    
    compiler = next((p for p in paths if p and os.path.exists(p)), None)
    
    if not compiler:
        print("[-] Inno Setup Compiler (ISCC) not found. Please install Inno Setup 6.")
        print(f"[*] Script generated at: {script_path}")
        return False
        
    try:
        subprocess.run([compiler, str(script_path)], check=True)
        print("[+] Compilation Successful!")
        return True
    except subprocess.CalledProcessError as e:
        print(f"[-] Compilation Failed: {e}")
        return False

def main():
    if not DIST_DIR.exists():
        DIST_DIR.mkdir()
        
    # 1. Download Readest
    readest_path = download_latest_readest()
    
    # 2. Build Cambridge
    cambridge_path = build_cambridge()
    
    if not (readest_path and cambridge_path):
        print("[!] Missing components. Aborting bundle.")
        return

    # Copy files to DIST_DIR if not already there
    final_cambridge = DIST_DIR / cambridge_path.name
    if final_cambridge != cambridge_path:
        shutil.copy2(cambridge_path, final_cambridge)
        
    # 3. Generate Inno Script
    script_path = generate_inno_script(final_cambridge, readest_path)
    
    # 4. Compile
    if compile_inno(script_path):
        print(f"\n[SUCCESS] Modern Installer Ready: {DIST_DIR / 'CambridgeSetup_v1.exe'}")
    else:
        print(f"\n[DONE] Intermediate files in {DIST_DIR}. Install Inno Setup to build the final .exe.")

if __name__ == "__main__":
    main()
