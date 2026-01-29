import connect from '../../../../config/bd.js';

const getBrands = async (order_by = "nombre__ASC") => {
    const db = await connect();
    try {

      const [attribute, direction] = order_by.split("__");

      console.log(direction);

        // Consulta para obtener todos los usuarios
        const [rows, fields] = await db.execute(`SELECT marca_id , marca_nombre FROM automarc_automarco.tbl_marcas_2 where marca_estado = 1 order by marca_nombre ${direction}`);
        console.log('Todos los usuarios:', rows);


    
      return rows;
    } catch (error) {
        console.error('Error al obtener datos:', error);
    } finally {
        db.end();
    }

  };



  export {

    getBrands

  };