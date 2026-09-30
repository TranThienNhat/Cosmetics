@echo off
chcp 65001 > nul
echo ========================================================
echo   Dang khoi tao Python Virtual Environment (venv)...
echo ========================================================

cd /d "%~dp0"

if not exist "venv" (
    echo [1/3] Tao moi moi truong ao venv...
    python -m venv venv
    if errorlevel 1 (
        echo [LOI] Khong the tao venv. Vui long dam bao da cai Python tren may.
        pause
        exit /b 1
    )
) else (
    echo [1/3] Thu muc venv da ton tai.
)

echo [2/3] Nang cap pip...
call .\venv\Scripts\python.exe -m pip install --upgrade pip

echo [3/3] Cai dat cac thu vien Machine Learning tu requirements.txt...
call .\venv\Scripts\pip install -r requirements.txt
if errorlevel 1 (
    echo [LOI] Cai dat that bai.
    pause
    exit /b 1
)

echo.
echo ========================================================
echo   HOAN TAT! Moi truong ML (venv) da san sang.
echo   Tat ca thu vien (sklearn, mlxtend, pandas,...) da duoc cai dat.
echo ========================================================
