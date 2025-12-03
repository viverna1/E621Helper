import os
import zipfile

file_path = "e621helper.xpi"

# Удаляем старый XPI, если он существует
if os.path.exists(file_path):
    os.remove(file_path)
    print(f"Файл {file_path} удалён")
else:
    print("Файл не найден, создаём новый")

# Чёрный список (файлы и папки)
blacklist = [".python scripts", ".git", "e621helper.xpi", ".test", ".gitignore", "convert.py"]

with zipfile.ZipFile(file_path, "w") as archive:
    for root, dirs, files in os.walk("."):
        # Убираем из обхода папки из чёрного списка
        dirs[:] = [d for d in dirs if d not in blacklist]

        for file in files:
            if file in blacklist:
                continue  # пропускаем объекты из чёрного списка
                
            full_path = os.path.join(root, file)
            rel_path = os.path.relpath(full_path, ".")
            archive.write(full_path, rel_path)

print(f"Файл {file_path} создан с рекурсивно добавленными файлами")
