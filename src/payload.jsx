import CircularJSON from 'circular-json';
import HotData from './hot_data.json';

// eslint-disable-next-line
export default CircularJSON.parse(JSON.stringify(process.env.NODE_ENV === 'production' ? payload : HotData));
