from create_app import db

class Solicitudes(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(50), nullable=False)
    edad = db.Column(db.Text, nullable=False)
    ingresos = db.Column(db.Text, nullable=False)
    historial_id = db.Column(db.Text, nullable=False)
    monto = db.Column(db.Text, nullable=False)
    public_key = db.Column(db.Text, nullable=False)

    def as_dict(self):
        return {c.name: getattr(self, c.name) for c in self.__table__.columns}

class HistorialCrediticio(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    historial = db.Column(db.String(255), nullable=False)

    def __repr__(self):
        return f'<HistorialCrediticio {self.historial}>'

        
class Ofertas(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    prestamista = db.Column(db.String(50), nullable=False)
    montoOfrecido = db.Column(db.Text, nullable=False)
    interesOferta = db.Column(db.Text, nullable=False)
    tiempoPrestamo = db.Column(db.Text, nullable=False)
    
    solicitud_id = db.Column(db.Integer, db.ForeignKey('solicitudes.id'), nullable=False)
    solicitud = db.relationship('Solicitudes', backref=db.backref('ofertas', lazy=True))
