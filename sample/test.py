import face_recognition
import sys
import pathlib
import pickle

directory = sys.argv[1]
person_names = []
train_face_encodings = []
print("Loading Directory "+directory)
print("Loading Encodings")
for filename in pathlib.Path(directory).iterdir():
    if filename.name.split('.')[1] in ['enc']:
        person_names.append(filename.name.split('.')[0])
        read_file = open(filename,'rb')
        tmp_encoding = pickle.load(read_file)
        train_face_encodings.append(tmp_encoding)
        print("Loading encoding "+person_names[-1])
        read_file.close()

for filename in pathlib.Path(directory).iterdir():
    if filename.name.split('.')[1] in ['jpg','jpeg'] and filename.name.split('.')[0] not in person_names:
        person_names.append(filename.name.split('.')[0])
        print("Encoding of "+person_names[-1]+" not found!!")
        print("Loading "+person_names[-1])
        train_image = face_recognition.load_image_file(filename)
        train_face_encodings.append(face_recognition.face_encodings(train_image)[0])
        write_filename = directory+filename.name.split('.')[0]+'.enc'
        write_file = open(write_filename,'wb')
        pickle.dump(train_face_encodings[-1],write_file)
        print("Writing Encoding of "+person_names[-1]+" to file")
        write_file.close()

print("Training Complete!!")
directory = sys.argv[2]
unknown_face_encodings = []
print("Loading Directory "+directory)
for filename in pathlib.Path(directory).iterdir():
    if filename.name.split('.')[1] in ['jpg','jpeg']:
        test_image = face_recognition.load_image_file(filename)
        # unknown_face_encodings.append(face_recognition.face_encodings(test_image)[0])
        temporary_encoding = face_recognition.face_encodings(test_image)
        for unknown_faces in temporary_encoding:
            print("Loading Unknown Image!")
            unknown_face_encodings.append(unknown_faces)

# print(unknown_face_encodings)
# for tmp in unknown_face_encodings:
#     print(tmp)
print("Checking For Known Faces")
for i,encoding in enumerate(train_face_encodings):
    # print(encoding)
    for test_encoding in unknown_face_encodings:
        test_encoding = [test_encoding]
        result = face_recognition.compare_faces(encoding,test_encoding)
        if result[0] == True:
            print("Found "+person_names[i])
# results = face_recognition.compare_faces(train_face_encodings,test_face_encodings)
# print(results)


