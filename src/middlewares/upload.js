import multer from 'multer';
import path from 'path';
import fs from 'fs';

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        let folder;
        if (file.originalname === 'profile.jpg') {
            folder = 'profiles';
        } else if (file.originalname === 'product.jpg') {
            folder = 'products';
        } else {
            folder = 'assets';
        }
        const dir = path.join(process.cwd(), `uploads/${folder}`);

        fs.mkdirSync(dir, { recursive: true });

        cb(null, dir);
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname); 
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 1024 * 1024 * 5 },
});


export default upload;
