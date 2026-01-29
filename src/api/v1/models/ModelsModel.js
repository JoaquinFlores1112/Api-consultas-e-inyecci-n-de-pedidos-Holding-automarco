import connect from '../../../../config/bd.js';

const getModels = async (order_by = "nombre__ASC", marca_id = 0) => {
    const db = await connect();
    try {

      const [attribute, direction] = order_by.split("__");

      console.log(direction);

      let queryMarca = '';
      if(marca_id>0){
        queryMarca = ' and marca_id = ' + marca_id;
      }

      

        // Consulta para obtener todos los usuarios
        const [rows, fields] = await db.execute(`SELECT id_mod, mod_id, marca_id, marca  FROM automarc_automarco.tbl_modelos_marcas_2 WHERE estado = 1 ${queryMarca} order by id_mod ${direction}`);
        console.log('Todos los usuarios:', rows);


    
      return rows;
    } catch (error) {
        console.error('Error al obtener datos:', error);
    } finally {
        db.end();
    }

  };



  export {

    getModels

  };