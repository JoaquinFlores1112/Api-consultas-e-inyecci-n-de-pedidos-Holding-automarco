//funcion para obtener cilindrada
import connect from '../../../../config/bd.js';

const getCategories = async (order_by = "nombre__ASC") => {
    const db = await connect();
    try {

      const [attribute, direction] = order_by.split("__");

      console.log(direction);

        // Consulta para obtener todos los usuarios
        const [rows, fields] = await db.execute(`SELECT id_cla , clasificacion_nombre FROM tbl_clasificaciones order by clasificacion_nombre ${direction}`);
        console.log('Todos los usuarios:', rows);


      
    //   const offset = (page - 1) * limits;
    //   const formattedQuery = format(
    //     "SELECT (select count(1) from tbl_productos) total_general, * FROM tbl_productos ORDER BY %s %s LIMIT %s OFFSET %s",
    //     attribute,
    //     direction,
    //     limits,
    //     offset
    //   );
  
    //   const response = await pool.query(formattedQuery);
      return rows;
    } catch (error) {
        console.error('Error al obtener datos:', error);
    } finally {
        db.end();
    }

  };



  export {

    getCategories

  };