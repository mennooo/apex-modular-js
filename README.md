# apex-modular-js
Using modular JavaScript with Oracle Application Express

This project is created for sample purposes only.

## Install this project
- Open the command line
- Go to your desired directory
- Execute
```bash
git clone https://github.com/mennooo/apex-modular-js.git
cd apex-modular-js		
npm install
```

## Install APEX Sample application
You can import the demo application in your APEX workspace. It's located in:
```
apex/f103.sql
```

## Run
**On the command line:**  
```bash
npm start
```
## Usage

From the `src` folder you can create, edit or delete any files in:
```
|-/src/
	|-js
    |-application
      |-kscope
    |-modules
    |-widgets
```
If you want to include any module or widget in the sample application then change the following config file:
```
config.json
```
The names of modules and widgets must be the same as the corresponding .js files.

Saving changes to file in the src/ folder will automatically compile your files to this folder structure:
```
|-/dist/
    |-kscope
```

A zipfile called kscope.zip will be created everytime you save a change:
```
dist/kscope/kscope.zip
```
Please upload the file dist/kscope/kscope.zip to APEX Static Application Files in the sample application.
