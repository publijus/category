import pandas as pd
import json
import os

def excel_to_json_with_parent(excel_file_path, json_file_path):
    df = pd.read_excel(excel_file_path)
    df['parentId'] = df.apply(lambda row: calculate_parent_id(row['path'], df), axis=1)
    df['kiekis'] = df['kiekis'].fillna(0).astype(int)  # Užpildome NaN reikšmes ir konvertuojame į sveikuosius skaičius
    df['parentId'] = df['parentId'].fillna(0).astype(int)  # Užpildome NaN reikšmes ir konvertuojame į sveikuosius skaičius
    data = df.to_dict(orient='records')
    
    with open(json_file_path, 'w', encoding='utf-8') as json_file:
        json.dump(data, json_file, ensure_ascii=False, indent=4)

def calculate_parent_id(path, df):
    if len(path) == 6:
        return None
    parent_path = path[:-6]
    parent_row = df[df['path'] == parent_path]
    if not parent_row.empty:
        return parent_row.iloc[0]['id']
    return None

# Nurodykite savo Excel failo kelią ir JSON failo išvesties kelią
current_dir = os.path.dirname(os.path.abspath(__file__))
excel_file_path = r'C:\Users\tulab\OneDrive\Partan\Kategorijos\Python\categories.xlsx'
json_file_path = os.path.join(current_dir, '..', 'public', 'categories.json')

excel_to_json_with_parent(excel_file_path, json_file_path)
print(f'JSON file has been created at: {json_file_path}')
