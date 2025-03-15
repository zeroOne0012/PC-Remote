@echo off
if "%~1"=="" (
	set time_s=3600
) else ( 
	set time_s=%1
)
shutdown -s -t %time_s%
