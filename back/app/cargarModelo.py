from ultralytics import YOLO

def cargarModelo(peso_path="best12.pt"):
    print("Cargando modelo YOLO...")
    model = YOLO(peso_path)
    print("Modelo YOLO cargado")
    return model
