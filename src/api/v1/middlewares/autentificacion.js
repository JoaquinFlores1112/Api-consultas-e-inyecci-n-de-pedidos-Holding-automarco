import jwt from 'jsonwebtoken';

const verificarToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; 

    if (!token) {
        return res.status(401).json({ message: 'Acceso denegado. No se proporcionó token.' });
    }

    try {
        const MI_CLAVE_SECRETA = "contraseña"; 

        const decoded = jwt.verify(token, MI_CLAVE_SECRETA);
        
        req.user = decoded; 
        next(); 
    } catch (error) {
        console.log("Error de token:", error.message); // Esto te ayudará a ver qué pasa en consola
        return res.status(403).json({ message: 'Token inválido o expirado.' });
    }
};

export default verificarToken;