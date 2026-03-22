import cv2
import os

def frame_de_video(entrada, saida_caminho, intervalo=30):
    entrada_captura = cv2.VideoCapture(entrada)
    cont = 0
    salvo = 0

    os.makedirs(saida_caminho, exist_ok=True)

    while entrada_captura.isOpened():
        retorno, frame = entrada_captura.read()

        if not retorno:
            break

        if cont % intervalo == 0:
            nome_arquivo = os.path.join(saida_caminho, f"{salvo}.png")
            cv2.imwrite(nome_arquivo, frame)
            salvo += 1

        cont += 1

    entrada_captura.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    frame_de_video("orquidea.mp4", "frames", intervalo=1)