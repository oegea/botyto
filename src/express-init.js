/**
 * Inicializa Express y Socket.io
 */
class ExpressInit {

    constructor(logger){

        //Carga de dependencias
        const express     = require('express');
        const httpLib     = require('http');
        const ioLib       = require('socket.io');
        
        //Propiedades
        this.logger       = logger;

        //Empezamos a escuchar webserver utilizando express
        const app = express();
        this.http = httpLib.createServer(app);
        this.io = ioLib(this.http);

        //Enrutador de Express
        app.get('/', (req, res) => {
            res.sendFile(__dirname + '/public/index.html');
        });

        app.get('/voice.html', (req, res) => {
            res.sendFile(__dirname + '/public/voice.html');
        });

        app.get('/window.html', (req, res) => {
            res.sendFile(__dirname + '/public/window.html');
        });

        app.use('/assets/', express.static(__dirname + '/public/assets') );

        //Sockets
        this.io.on('connection', (socket) => {
            this.logger.log('A new user has connected');
        });

        this.http.listen(3000, () => {
            this.logger.log('Express server listening on port 3000');
        });
    }

    /**
     * Apaga el webserver de express
     */
    close(){
        this.http.close();
        this.logger.log('Express server has been stopped');
    }
}


module.exports = ExpressInit;