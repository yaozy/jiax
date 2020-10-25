const Parser = require('../../lib/utils/redis/parser');


const parser = new Parser();


// 截断测试

parser.execute(Buffer.from('+'));
parser.execute(Buffer.from('123456\r\n'));

parser.execute(Buffer.from('$6\r'));
parser.execute(Buffer.from('\n123456\r'));

parser.execute(Buffer.from('\n$6'));
parser.execute(Buffer.from('\r\n123456\r'));

parser.execute(Buffer.from('\n:123'));
parser.execute(Buffer.from('456\r'));
parser.execute(Buffer.from('\n:'));
parser.execute(Buffer.from('123456\r'));

parser.execute(Buffer.from('\n-123中').slice(0, -1));
parser.execute(Buffer.from('中456\r\n').slice(2));

parser.execute(Buffer.from('$9\r\n123中').slice(0, -1));
parser.execute(Buffer.from('中456\r').slice(2));


// 测试数组
parser.execute(Buffer.from('\n*'));
parser.execute(Buffer.from('3\r\n+123中'));
parser.execute(Buffer.from('456\r\n$'));
parser.execute(Buffer.from('10\r\n0123456789\r'));
parser.execute(Buffer.from('\n:123456\r'));

parser.execute(Buffer.from('\n*3\r\n'));
parser.execute(Buffer.from('+123中456\r'));
parser.execute(Buffer.from('\n$'));
parser.execute(Buffer.from('10\r\n0123456789'));
parser.execute(Buffer.from('\r\n:123456'));

parser.execute(Buffer.from('\r\n*3\r'));
parser.execute(Buffer.from('\n+123中456\r'));
parser.execute(Buffer.from('\n$10\r'));
parser.execute(Buffer.from('\n0123456789'));
parser.execute(Buffer.from('\r\n:123456\r\n'));

