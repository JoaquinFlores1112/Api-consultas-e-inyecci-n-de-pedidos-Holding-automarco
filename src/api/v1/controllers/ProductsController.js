import {
  getStockProducts,
  getOCdefinitiva,
  insertPedido,
  obtenerCorrelativo,
  obtenerCondpagoPorSucursal,
  validarPedidoEmpresa,
  obtenerNombreTransporte,
  obtenerDireccionSucursal
} from "../models/productsModel.js";

import prepareHateoas from "../helpers/hateoas.js";
import connection from "../../../../config/bdpedidosprueba.js";

const getStockProductsController = async (req, res) => {
  try {
    const { empresa, codigo, cantidad } = req.params;

    if (!empresa) return res.status(400).json({ message: "Empresa requerida!" });
    if (!codigo) return res.status(400).json({ message: "Codigo requerido!" });
    if (isNaN(cantidad)) return res.status(400).json({ message: "Cantidad requerida!" });

    const products = await getStockProducts(empresa, codigo, cantidad);
    
    if (products.length > 0) res.status(200).json({ message: "Disponible" });
    else res.status(200).json({ message: "No disponible" });

  } catch (error) {
    console.log("error", error);
    res.status(500).json({ message: "Error al consultar stock" });
  }
};
const getOCdefinitivaController = async (req, res) => {
  try {
    const { empresa, correlativo } = req.body;
    if(!correlativo) return res.status(400).json({ message: "Correlativo requerido" });

    let pedvenrut = correlativo.split("-")[0];
    let pedcorint = correlativo.split("-")[1];

    const oc = await getOCdefinitiva(empresa, pedcorint, pedvenrut);
    res.status(200).json({ oc });
  } catch (error) {
    console.log("error", error);
    res.status(500).json({ message: "Error al obtener OC" });
  }
}


const insertarPedidosRepSolController = async (req, res) => {
    
    const db = await connection.getConnection();
    await db.beginTransaction();

    try {
        
        let rut = req.headers['x-rut-prueba'];
        if (!rut) { await db.rollback(); db.release(); return res.status(401).json({ message: "Falta header 'x-rut-prueba'" }); }
        
        const body = req.body;
        
        // sacar precios de los productos
        await validarPedidoEmpresa(body.productos, rut);

        
        const validaCampo = (v) => (v === undefined || v === null || v === "" || v === "null") ? null : v;
        const todosSonFrenos = body.productos.every(p => p.empresa === 'FRENOS');
        const pedvenrut = todosSonFrenos ? 94 : 93; 
        const pedcorint = await obtenerCorrelativo(); 
        const unificado = body.unificado ? 1 : 0;

        // sacar el nombre del transporte
        let tran_nombre = validaCampo(body.tran_nombre);
        if (!tran_nombre && body.tran_id) tran_nombre = await obtenerNombreTransporte(body.tran_id);

        // Sucursales
        const sucursales = body.sucursales || {};
        const secAutomarco = validaCampo(sucursales.AUTOMARCO);
        const secAutotec   = validaCampo(sucursales.AUTOTEC);
        const secHD        = validaCampo(sucursales.HD);
        const secGabtec    = validaCampo(sucursales.GABTEC); 

        // comparar direccion de las sucursales entregadas
        const direccionesDetectadas = [];
        let direccionFinal = "RETIRO / SIN INFORMACIÓN";
        let comunaFinal = "";
        
        const chequearDireccion = async (emp, sec) => {
            if (sec) {
                const d = await obtenerDireccionSucursal(rut, emp, sec);
                
                // --- VALIDACIÓN DE SEGURIDAD ---
                // Si la BD retorna null, la sucursal no existe o no es del cliente.
                if (!d) {
                    throw new Error(`Error: La sucursal código '${sec}' para ${emp} no existe o no esta creada.`);
                }

                if (d.direccion) {
                    direccionesDetectadas.push(d.direccion.trim().toUpperCase());
                    if (direccionFinal === "RETIRO / SIN INFORMACIÓN") {
                        direccionFinal = d.direccion.trim();
                        comunaFinal = d.comuna ? d.comuna.trim() : "";
                    }
                }
            }
        };
        
        // Ejecutamos validaciones (si alguna falla, salta al catch y hace rollback)
        await chequearDireccion("AUTOMARCO", secAutomarco);
        await chequearDireccion("AUTOTEC", secAutotec);
        await chequearDireccion("HD", secHD);
        await chequearDireccion("GABTEC", secGabtec);

        if ([...new Set(direccionesDetectadas)].length > 1) {
             throw new Error(`Error Logístico: Las direcciones de las sucursales no coinciden entre sí.`);
        }

        // sacar las condiciones de pago por sucursal
        const convenAutomarco = secAutomarco ? await obtenerCondpagoPorSucursal(db, rut, secAutomarco, "AUTOMARCO") : null;
        const convenAutotec   = secAutotec   ? await obtenerCondpagoPorSucursal(db, rut, secAutotec, "AUTOTEC") : null;
        const convenHD        = secHD        ? await obtenerCondpagoPorSucursal(db, rut, secHD, "HD") : null;
        const convenGabtec    = secGabtec    ? await obtenerCondpagoPorSucursal(db, rut, secGabtec, "GABTEC") : null;

       
        const datosCabecera = {
            rut, pedvenrut, pedcorint, tran_nombre, unificado,
            secAutomarco, convenAutomarco,
            secAutotec, convenAutotec,
            secHD, convenHD,
            secGabtec, convenGabtec
        };
        
        const productosParaModelo = body.productos.map(p => ({
            codigo: p.sku, cantidad: p.cantidad, precio: p.precio, empresa: p.empresa   
        }));

        // insertar pedido dmz y api
        const idPedido = await insertPedido(db, datosCabecera, productosParaModelo);

    
        await db.commit();

        res.status(201).json({
            message: "Pedido creado exitosamente",
            detalle_pedido: {
                pedido: `${pedvenrut}-${pedcorint}`, 
                transporte: tran_nombre,
                id_transporte: body.tran_id,
                id_interno: idPedido
            },
            datos_cliente: { 
                rut: rut, 
                condicion_pago: { automarco: convenAutomarco, gabtec: convenGabtec, autotec: convenAutotec, hd: convenHD },
                direccion_despacho: direccionFinal,
                comuna: comunaFinal
            },
            detalle_productos: body.productos.map(p => ({
                sku: p.sku, descripcion: p.titulo || "Producto", cantidad: p.cantidad, precio_unitario: p.precio, empresa: p.empresa 
            })),
        });

    } catch (error) {
        await db.rollback(); 
        console.error("Error creando pedido:", error.message);
        
        
        res.status(500).json({ 
            message: "No se pudo procesar el pedido", 
            error_detail: error.message 
        });
    } finally {
        db.release();
    }
};


export {
  getStockProductsController,
  getOCdefinitivaController,
  insertarPedidosRepSolController
};

