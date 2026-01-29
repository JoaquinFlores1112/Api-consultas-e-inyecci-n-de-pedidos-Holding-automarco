import mysql from "mysql2/promise";

// const connect = async () => {

// try {
const connection1 = mysql.createPool({
  namedPlaceholders: true,
  host: "dbaws.automarco.cl",
  port: 3306,
  user: "admingabtec@db-gabtec-server",
  password: "2wkPnhSa4x",
  database: "gestioncar",
});

console.log("Conexión a MySQL establecida.");
// return connection;
// } catch (error) {
//   console.error("Error al conectar a MySQL:", error);
//   throw error;
// }

// }

export default connection1;
