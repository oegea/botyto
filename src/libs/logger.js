/**
 * Mostrar mensajes por consola
 */
class Logger {
    /**
     * CTOR
     * @param {Object} win Objeto de la ventana de Electron
     */
    constructor(win){
        this.win = win;
    }

    /**
     * Recupera hora y minutos actuales
     */
    _getTime(){
        const date = new Date();
        return `${date.getHours()}:${(date.getMinutes()<10?'0':'') + date.getMinutes()}`;
    }

    /**
     * Muestra un mensaje en el log de la ventana
     * @param {String} message Mensaje a mostrar 
     */
    log(message){
        this.win.webContents.send('terminal-message', `[${this._getTime()}] ${message}`);
    }
}

module.exports = Logger;