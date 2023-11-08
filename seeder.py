
from app import app, db
from models import HistorialCrediticio

def seed_historial():
    # Crear un contexto de aplicación
    with app.app_context():
        # Crear las entradas
        categorias = ['Excelente', 'Bueno', 'Regular', 'Malo']
        for categoria in categorias:
            historial = HistorialCrediticio(historial=categoria)
            db.session.add(historial)

        # Guardar los cambios en la base de datos
        db.session.commit()

if __name__ == '__main__':
    seed_historial()
