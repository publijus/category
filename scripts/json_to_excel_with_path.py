import pandas as pd
import json

# Load the JSON data from the file
file_path = r'C:\Users\tulab\OneDrive\Partan\Kategorijos\Python\partan_kategorijos.json'
with open(file_path, 'r', encoding='utf-8') as file:
    data = json.load(file)

# Extract only relevant fields from JSON data
filtered_data = [{'id': item['id'], 'name': item['name'], 'parentId': item['parentId']} for item in data]

# Function to build category paths excluding the root categories
def build_paths_excluding_root(data):
    id_to_path = {}
    for item in data:
        if item['parentId'] is None:
            continue  # Skip the root category
        id_to_path[item['id']] = item['name']
        parent_id = item['parentId']
        while parent_id:
            parent = next(x for x in data if x['id'] == parent_id)
            if parent['parentId'] is None:
                break  # Skip adding the root category to the path
            id_to_path[item['id']] = parent['name'] + " -> " + id_to_path[item['id']]
            parent_id = parent['parentId']
    return id_to_path

# Build the paths excluding the root categories
paths_excluding_root = build_paths_excluding_root(filtered_data)

# Create a new DataFrame with the required information
df_paths_excluding_root = pd.DataFrame({
    'category_id': list(paths_excluding_root.keys()),
    'category_path': list(paths_excluding_root.values())
})

# Generate SQL commands
sql_commands = []
for index, row in df_paths_excluding_root.iterrows():
    sql_command = f"UPDATE catalogue_category SET full_path_lt = '{row['category_path']}' WHERE id = {row['category_id']};"
    sql_commands.append(sql_command)

# Add the SQL commands to the DataFrame
df_paths_excluding_root['sql_command'] = sql_commands

# Save to Excel
output_file_path = 'category_paths_with_sql.xlsx'
df_paths_excluding_root.to_excel(output_file_path, index=False)

# Display the first few rows of the DataFrame to verify
df_paths_excluding_root.head()
