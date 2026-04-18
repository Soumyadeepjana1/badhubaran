import os

html_files = []
for root, dirs, files in os.walk('templates'):
    for file in files:
        if file.endswith('.html'):
            html_files.append(os.path.join(root, file))

for f in html_files:
    with open(f, 'r') as file:
        content = file.read()
    
    # CSS
    content = content.replace('href="css/style.css"', 'href="/static/css/style.css"')
    content = content.replace('href="../css/style.css"', 'href="/static/css/style.css"')
    
    # JS
    content = content.replace('src="js/db.js"', 'src="/static/js/db.js"')
    content = content.replace('src="../js/db.js"', 'src="/static/js/db.js"')
    content = content.replace('src="js/app.js"', 'src="/static/js/app.js"')
    content = content.replace('src="../js/app.js"', 'src="/static/js/app.js"')
    
    # Images
    content = content.replace("url('assets/images/", "url('/static/images/")
    content = content.replace('src="assets/images/', 'src="/static/images/')
    content = content.replace('src="../assets/images/', 'src="/static/images/')
    
    with open(f, 'w') as file:
        file.write(content)

print("Paths updated.")
