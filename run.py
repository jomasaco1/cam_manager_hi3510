# run.py
from app import create_app

app = create_app()

if __name__ == '__main__':
    # Usar host='0.0.0.0' para ser acessível na sua rede local
    app.run(debug=True, host='0.0.0.0', port=5001)