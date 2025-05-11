import os
import shutil

class FileUtils:
    def __init__(self, base_folder: str):
        """
        Initialize with a base folder path.
        """
        self.base_folder = base_folder
        if not os.path.exists(base_folder):
            os.makedirs(base_folder)

    def create_file(self, category: str, subcategory: str, name: str, filename: str, content: str):
        """
        Create a file under category/subcategory/name with the specified filename.
        """
        dir_path = os.path.join(self.base_folder, category, subcategory, name)
        os.makedirs(dir_path, exist_ok=True)
        file_path = os.path.join(dir_path, filename)
        with open(file_path, 'w') as file:
            file.write(content)
        print(f"File created: {file_path}")
    
    def list_files(self, category: str = '', subcategory: str = '', name: str = '', search_term: str = None):
        """
        List files with optional filtering by category, subcategory, and name. 
        Search term filters filenames containing the term.
        If no name is provided, traverse all subdirectories.
        Returns a list of tuples with file path and content.
        """
        dir_path = os.path.join(self.base_folder, category, subcategory, name) if name else os.path.join(self.base_folder, category, subcategory)
        if not os.path.exists(dir_path):
            print("No matching directory found.")
            return []
        files = []
        for root, _, filenames in os.walk(dir_path):
            for file in filenames:
                if search_term is None or search_term.lower() in file.lower():
                    file_path = os.path.join(root, file)
                    with open(file_path, 'r') as f:
                        content = f.read()
                    files.append({"path":os.path.relpath(file_path, self.base_folder), "content":content})
        return files

    def edit_file(self, category: str, subcategory: str, name: str, filename: str, new_content: str):
        """
        Edit an existing file by overwriting it with new content.
        """
        file_path = os.path.join(self.base_folder, category, subcategory, name, filename)
        if os.path.exists(file_path):
            with open(file_path, 'w') as file:
                file.write(new_content)
            print(f"File updated: {file_path}")
        else:
            print("File not found.")

    def delete_file(self, category: str, subcategory: str, name: str, filename: str):
        """
        Delete a file from the specified location.
        """
        file_path = os.path.join(self.base_folder, category, subcategory, name, filename)
        if os.path.exists(file_path):
            os.remove(file_path)
            print(f"File deleted: {file_path}")
        else:
            print("File not found.")