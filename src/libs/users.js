/**
 * Gestión de usuarios y puntos
 */
class Users {
    /**
     * CTOR
     * @param {Object} storage Datos persistentes
     */
    constructor(storage){
        this.storage = storage;
    }

    /**
     * Recupera la información de los usuarios de la base de datos
     */
    async getUsers(){
        let users = await this.storage.getItem('users');
        if (users === undefined)
            users = {};

        return users;
    }

    /**
     * Actualiza los datos de los usuarios en la base de datos
     * @param {Object} users Datos de los usuarios a actualizar
     */
    async setUsers(users){
        await this.storage.setItem('users', users);
    }

    /**
     * Hashea un nombre de usuario para que al almacenarlo en BBDD no se tengan datos personales
     * @param {String} username Nombre de usuario a hashear
     */
    hashUsername(username){
        return require('crypto').createHash('sha256').update(username, 'binary').digest('hex');
    }

    /**
     * Recupera puntos actuales de un usuario
     * @param {String} username Nombre de usuario
     */
    async getPoints(username){
        const users = await this.getUsers();
        let hashedUsername = this.hashUsername(username);
        return (users && users[hashedUsername])?users[hashedUsername].points:0;
    }

    /**
     * Resta puntos a un usuario
     * @param {String} username Nombre de usuario
     * @param {Number} amount Puntos a restar
     */
    async removePoints(username, amount){
        await this._changePoints(username, -amount);
    }

    /**
     * Añade puntos a un usuario
     * @param {String} username Nombre de usuario
     * @param {Number} amount Puntos a añadir
     */
    async addPoints(username, amount){
        await this._changePoints(username, amount);
    }

    /**
     * Cambia puntos a un usuario
     * @param {String} username Nombre de usuario
     * @param {Number} amount Puntos a añadir o quitar
     */
    async _changePoints(username, amount){
        const users = await this.getUsers();
        let hashedUsername = this.hashUsername(username);

        if (users[hashedUsername] === undefined){
            users[hashedUsername] = { points: 0, userLevel: 0 };
        }
        users[hashedUsername].points = users[hashedUsername].points + amount;
        await this.setUsers(users);
    }
}

module.exports = Users;