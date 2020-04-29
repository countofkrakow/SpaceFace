from deepface import DeepFace
import os
import sys
import numpy as np
from deepface.extendedmodels import Age, Gender, Race, Emotion

img_path = 'thumbnails128x128/00000/00017.png'
models = {}
models["emotion"] = Emotion.loadModel()
models["age"] = Age.loadModel()
models["gender"] = Gender.loadModel()
models["race"] = Race.loadModel()
#print(DeepFace.analyze(img_path,models=models))
dtype = [
        ('fname', 'U33'),
        ('age', 'f4'),
        ('gender', 'U8'),
        ('dominant_race', 'U15'),
        ('asian', 'f4'),
        ('indian', 'f4'),
        ('black', 'f4'),
        ('white', 'f4'),
        ('middle eastern', 'f4'),
        ('latino hispanic', 'f4'),
        ('dominant_emotion', 'U8'),
        ('angry', 'f4'),
        ('disgust', 'f4'),
        ('fear', 'f4'),
        ('happy', 'f4'),
        ('sad', 'f4'),
        ('surprise', 'f4'),
        ('neutral', 'f4')
        ]
results = []
root_dir = 'thumbnails128x128'

for folder in os.listdir(root_dir):
    print(f'folder: {folder}')
    for image in os.listdir(f'{root_dir}/{folder}'):
        img_fname = f'{root_dir}/{folder}/{image}'
        try:
            res = DeepFace.analyze(img_fname,models=models)
            entry = (img_fname,
                    res['age'],
                    res['gender'],
                    res['dominant_race'],
                    res['race']['asian'],
                    res['race']['indian'],
                    res['race']['black'],
                    res['race']['white'],
                    res['race']['middle eastern'],
                    res['race']['latino hispanic'],
                    res['dominant_emotion'],
                    res['emotion']['angry'],
                    res['emotion']['disgust'],
                    res['emotion']['fear'],
                    res['emotion']['happy'],
                    res['emotion']['sad'],
                    res['emotion']['surprise'],
                    res['emotion']['neutral'])
            print(entry)
            results.append(entry)

        except:
            print("Unexpected error:", sys.exc_info()[0])

print(len(results))
result = np.array(results, dtype=dtype)
np.save("results", result)
