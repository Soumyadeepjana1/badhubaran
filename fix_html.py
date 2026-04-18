import os, glob

for f in glob.glob('templates/**/*.html', recursive=True):
    with open(f, 'r') as file:
        content = file.read()
    
    # Remove sql-wasm
    content = content.replace('<script src="https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/sql-wasm.js"></script>', '')
    
    # Update paths
    content = content.replace('href="css/style.css"', 'href="/static/css/style.css"')
    content = content.replace('href="../css/style.css"', 'href="/static/css/style.css"')
    
    content = content.replace('src="js/db.js"', 'src="/static/js/db.js"')
    content = content.replace('src="../js/db.js"', 'src="/static/js/db.js"')
    
    content = content.replace('src="js/app.js"', 'src="/static/js/app.js"')
    content = content.replace('src="../js/app.js"', 'src="/static/js/app.js"')
    
    with open(f, 'w') as file:
        file.write(content)
