import './firebase';
import { Gallery } from './gallery/Gallery';
import './gallery/gallery.css';

const app = document.getElementById('app')!;
const gallery = new Gallery(app);
gallery.init();
