@echo off
echo Installing Python ML dependencies...
echo This may take a few minutes on first run (TensorFlow is large).
echo.
pip install -r requirements.txt
echo.
echo Testing ML service startup...
python -c "import fastapi, uvicorn, sklearn, numpy, pandas, joblib; print('Core packages OK')"
python -c "import tensorflow; print('TensorFlow OK - version:', tensorflow.__version__)" 2>nul || echo "TensorFlow optional - skipped"
echo.
echo Setup complete. Run: python app.py
pause
