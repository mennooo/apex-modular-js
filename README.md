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
The names of modules and widgets must be the same as the corresponding `.js` files.

Saving changes to file in the `src` folder will automatically compile your files to this folder structure:
```
|-/dist/
    |-kscope
```

A zipfile called `kscope.zip` will be created everytime you save a change:
```
dist/kscope/kscope.zip
```
Please upload the file `dist/kscope/kscope.zip` to APEX Static Application Files in the sample application.

## About the APEX sample application

The application includes 4 examples about using the Modular JavaScript approach.

It's based around integrating the <a href="https://sciactive.com/pnotify/" target="_blank">pNotify plugin</a>

Examples:
- 1: Load nessecary files in page, put code inside dynamic action (not recommended)
- 2: Encapsulate pNotify in kscope.message module, put code in p2.js file (a bit better)
- 3: Encapsulate kscope.message module in dynamic action plugin, add dynamic action to page 3 (prefered solution)
- 4: Encapsulate kscope.message module inside keyboardShortcuts module (advanced usage)

In example 4, it's not longer needed to include the message module in the `config.json` because it will be bundled as part of the keyboardShortcuts module. Feel free to test this out.
