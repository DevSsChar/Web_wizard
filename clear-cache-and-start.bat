@echo off
echo Clearing Next.js cache...
cd /d "c:\Users\Admin\Desktop\sudowudo\webwizard"
if exist .next rmdir /s /q .next
if exist node_modules\.cache rmdir /s /q node_modules\.cache
echo Cache cleared!
echo Starting development server...
npm run dev