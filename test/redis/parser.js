const Parser = require('../../lib/utils/redis/parser');


const parser = new Parser();


// 截断测试

parser.parse(Buffer.from('+'), 0);
parser.parse(Buffer.from('123456\r\n'), 0);

parser.parse(Buffer.from('$6\r'), 0);
parser.parse(Buffer.from('\n123456\r'), 0);

parser.parse(Buffer.from('\n$6'), 0);
parser.parse(Buffer.from('\r\n123456\r'), 0);

parser.parse(Buffer.from('\n:123'), 0);
parser.parse(Buffer.from('456\r'), 0);
parser.parse(Buffer.from('\n:'), 0);
parser.parse(Buffer.from('123456\r'), 0);

parser.parse(Buffer.from('\n-123中').slice(0, -1), 0);
parser.parse(Buffer.from('中456\r\n').slice(2), 0);

parser.parse(Buffer.from('$9\r\n123中').slice(0, -1), 0);
parser.parse(Buffer.from('中456\r').slice(2), 0);


// 测试数组
parser.parse(Buffer.from('\n*'), 0);
parser.parse(Buffer.from('3\r\n+123中'), 0);
parser.parse(Buffer.from('456\r\n$'), 0);
parser.parse(Buffer.from('10\r\n0123456789\r'), 0);
parser.parse(Buffer.from('\n:123456\r'), 0);

parser.parse(Buffer.from('\n*3\r\n'), 0);
parser.parse(Buffer.from('+123中456\r'), 0);
parser.parse(Buffer.from('\n$'), 0);
parser.parse(Buffer.from('10\r\n0123456789'), 0);
parser.parse(Buffer.from('\r\n:123456'), 0);

parser.parse(Buffer.from('\r\n*3\r'), 0);
parser.parse(Buffer.from('\n+123中456\r'), 0);
parser.parse(Buffer.from('\n$10\r'), 0);
parser.parse(Buffer.from('\n0123456789'), 0);
parser.parse(Buffer.from('\r\n:123456\r\n'), 0);

