import connection from '../../../../config/bdpedidosprueba.js'; 

const obtenerPermisos = async (token) => {
    const db = await connection;
    try {
        const sql = `SELECT autotec, automarco, gabtec, hd FROM automarc_automarco.tiene_permiso WHERE api_token = ?`;
        const [rows] = await db.execute(sql, [token]);
        return rows[0]; 
    } catch (e) {
        console.error("Error al obtener permisos:", e);
        return null;
    } finally {
 
    }
};

export default obtenerPermisos;