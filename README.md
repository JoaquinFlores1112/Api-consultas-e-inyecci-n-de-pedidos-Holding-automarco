# Api-consultas-e-inyeccion-de-pedidos-Holding-automarco
# Descripcion

# Guía de Instalación y Uso

Instrucciones simples para configurar y ejecutar el servidor.

## Instalación

Para instalar las dependencias del proyecto (node_modules), se ejecuta:

```bash
npm install
```
## Iniciar
Para iniciar el servidor, usa el siguiente comando:
```
Bash
node locar_server.js
```
## Cambios Hechos
### Implementacion de token de autentificación
Debido a que se necesitaba desarrollar la api para todos los clientes se implemento un token de autentificacion al rut del cliente para que puedan acceder a la api.
### Modificacion a la base de datos
para que el proyecto este disponible para todos los clientes ahora se usa la base de datos pedidos_api, que tiene las tablas: tbl_pedidos y tbl_pedidos_detalle, esta ultima se mantiene igual, sin embargo tbl_pedidos se crea de la siguiente forma:
``` Mysql
CREATE TABLE `pedidos_api.tbl_pedidos` (
  `id_pedido` int(11) NOT NULL AUTO_INCREMENT,
  `fecha` datetime NOT NULL DEFAULT current_timestamp(),
  `estado` int(11) NOT NULL DEFAULT 0,
  `pedvenrut` int(11) DEFAULT NULL,
  `pedcorint` int(11) DEFAULT NULL,
  `unificado` int(11) NOT NULL DEFAULT 0,
  `tran_nombre` varchar(255) DEFAULT NULL,
  `cli_rut` varchar(15) NOT NULL,
  `cli_sec_automarco` char(2) DEFAULT NULL,
  `cli_conven_automarco` char(2) DEFAULT NULL,
  `cli_sec_autotec` char(2) DEFAULT NULL,
  `cli_conven_autotec` char(2) DEFAULT NULL,
  `cli_sec_hd` char(2) DEFAULT NULL,
  `cli_conven_hd` char(2) DEFAULT NULL,
  `cli_sec_gabtec` char(2) DEFAULT NULL,
  `cli_conven_gabtec` char(2) DEFAULT NULL,
  PRIMARY KEY (`id_pedido`)
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=latin1
```
Adicional a esto se creo la tabla que maneja los permisos que tienen los usuarioas para comprar en las empresas, ademas  incluye el rut y el token de autentificacion para asi poder obtener todos los datos necesarios del cliente mediante estos dos campos, esta se crea de la siguiente forma:
```Mysql
CREATE TABLE `automarc_automarco.tiene_permiso` (
  `rut` varchar(15) NOT NULL,
  `automarco` int(11) DEFAULT 0,
  `hd` int(11) DEFAULT 0,
  `autotec` int(11) DEFAULT 0,
  `gabtec` int(11) DEFAULT 0,
  `api_token` text DEFAULT NULL,
  `fecha_actualizacion` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`rut`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8
```
### Se agregaron los siguientes endpoints:
• Sucursales: Despliega las sucursales de un cliente separadas por empresa, muestra la direccion, comuna y su ID.  
• Transportes: Despliega los transportes disponibles junto a su ID
### Verificacion de permisos
#### Se incluyo una verficacion de permisos la cual permite:
• Ver solo productos de las empresas en las cual el cliente compra  
• Retornar un error si es que un pedido multiempresa se incluye un producto
### Modificacion a la base de datos
