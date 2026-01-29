import jwt from "jsonwebtoken";
import mysql from "mysql2/promise";
import readline from "readline";

const dbConfig = {
    namedPlaceholders: true, 
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '',            
    database: 'automarc_automarco'  
};

const MI_CLAVE_SECRETA = 'contraseña'; 

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const preguntar = (texto) => {
    return new Promise((resolve) => {
        rl.question(texto, (respuesta) => resolve(respuesta));
    });
};

async function generarToken() {
    let connection;
    try {

        // pedir RUT
        const rutInput = await preguntar('Ingrese RUT del cliente: ');
        
        connection = await mysql.createConnection(dbConfig);
        
        // buscar rut en la tabla clientes (ahora en las 4 empresas)
        // array con las bases de datos posibles
        const basesDeDatos = [
            'automarc_automarco', 
            'autotec_ecom', 
            'autohd_automarcohd', 
            'gabteccl_sitbdd1978'
        ];
        
        let nombreCliente = "";
        let encontrado = false;

        for (const dbName of basesDeDatos) {
            try {
                // intenta buscar en cada base de datos
                const sqlCheck = `SELECT cli_razon_social FROM ${dbName}.tbl_clientes WHERE cli_rut = ?`; 
                const [rows] = await connection.execute(sqlCheck, [rutInput]);

                if (rows.length > 0) {
                    nombreCliente = rows[0].cli_razon_social;
                    encontrado = true;
                    break; // si se encuentra se cierra el bucle
                }
            } catch (err) {
            // si no lo encuentra sigue
                continue;
            }
        }

        if (!encontrado) {
            console.log(`ERROR: El RUT ${rutInput} no existe en ninguna tabla de clientes.`);
            process.exit(1);
        }


        // define permisos por consola
        console.log("--- DEFINIR PERMISOS (s = sí, enter = no) ---");
        
        const r1 = await preguntar('¿Permiso AUTOMARCO? : ');
        const r2 = await preguntar('¿Permiso GABTEC?    : ');
        const r3 = await preguntar('¿Permiso AUTOTEC?   : ');
        const r4 = await preguntar('¿Permiso HD?        : ');

        const dbPermisos = {
            automarco: r1.toLowerCase().trim() === 's' ? 1 : 0,
            gabtec:    r2.toLowerCase().trim() === 's' ? 1 : 0,
            autotec:   r3.toLowerCase().trim() === 's' ? 1 : 0,
            hd:        r4.toLowerCase().trim() === 's' ? 1 : 0
        };

        // genera token
        const payload = { 
            rut: rutInput,
            nombre: nombreCliente
        };

        const token = jwt.sign(payload, MI_CLAVE_SECRETA, { expiresIn: '365d' });

      
        // insertar datos de permisos y token en la bd
        const sqlUpsert = `
            INSERT INTO automarc_automarco.tiene_permiso (rut, api_token, automarco, gabtec, autotec, hd)
            VALUES (?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                api_token = VALUES(api_token),
                automarco = VALUES(automarco),
                gabtec = VALUES(gabtec),
                autotec = VALUES(autotec),
                hd = VALUES(hd)
        `;

        await connection.execute(sqlUpsert, [
            rutInput,
            token, 
            dbPermisos.automarco, 
            dbPermisos.gabtec, 
            dbPermisos.autotec, 
            dbPermisos.hd
        ]);


        console.log(`Cliente:  ${nombreCliente}`);
        console.log(`RUT:      ${rutInput}`);
        console.log(`Permisos: Automarco[${dbPermisos.automarco}] Gabtec[${dbPermisos.gabtec}] Autotec[${dbPermisos.autotec}] HD[${dbPermisos.hd}]`);
        console.log("\nToken Generado:");
        console.log(token);


    } catch (error) {
        console.error(" Error:", error.message);
    } finally {
        if (connection) await connection.end(); 
        rl.close();
    }
}

generarToken();