@echo off
setlocal

:: ============================================
::   LANCEUR CLAUDE CODE GRATUIT (Version Amelioree)
::   - Se deplace automatiquement dans le dossier du .bat
::   - Cree CLAUDE.md automatiquement s'il n'existe pas
::   - Force Claude a repondre en francais
:: ============================================

:: Aller dans le dossier où se trouve ce fichier .bat
cd /d "%\~dp0"

echo.
echo ============================================
echo   Lancement de Free Claude Code
echo   Dossier du projet : %cd%
echo ============================================
echo.

:: Créer le fichier CLAUDE.md s'il n'existe pas
if not exist "CLAUDE.md" (
    echo [INFO] Creation du fichier CLAUDE.md avec instructions en francais...
    (
        echo # Instructions permanentes pour Claude Code
        echo.
        echo Tu es un assistant expert en developpement web, en platrerie et en outils metier.
        echo.
        echo **Regles importantes :**
        echo - Reponds **toujours en francais**, de maniere claire, naturelle et professionnelle.
        echo - Utilise un ton amical mais professionnel.
        echo - Commente le code en francais quand tu en generes.
        echo - Propose des solutions pratiques et adaptees au contexte de l'entreprise UniC Plaquiste.
        echo - Demande des precisions si quelque chose n'est pas clair.
    ) > CLAUDE.md
    echo [OK] Fichier CLAUDE.md cree avec succes.
    echo.
)

:: Lancer le serveur proxy
echo [1/2] Demarrage du serveur proxy (fcc-server)...
start "Free Claude Server" powershell -NoExit -Command "fcc-server"

:: Attendre que le serveur soit pret
timeout /t 6 /nobreak >nul

:: Lancer Claude Code
echo [2/2] Lancement de Claude Code...
start "Claude Code" powershell -NoExit -Command "fcc-claude"

echo.
echo ============================================
echo   Claude Code est lance dans ce dossier !
echo   - Garde la fenetre "Free Claude Server" ouverte
echo   - Claude repondra en francais par defaut
echo ============================================
echo.
pause