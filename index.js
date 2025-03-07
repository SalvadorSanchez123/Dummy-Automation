import express from 'express';
import routes from './routes/routes.js';
import { create, engine } from 'express-handlebars';


// import session from 'express-session';
// import passport from 'passport';
// import passportConfig from './config/passport.js';
// import flash from 'connect-flash';
// import cron from 'node-cron';
// import dayjs from 'dayjs';
// import isoWeek from 'dayjs/plugin/isoWeek.js';
// import sessionFileStore from 'session-file-store'
// dayjs.extend(isoWeek);

const app = express();



//handlebars setup
app.engine('handlebars', engine({ defaultLayout: "main" }));
app.set('view engine', 'handlebars');
app.set('views', './views');
create().handlebars.registerHelper('increment', (index) => index + 1);
//bootstrap
app.use('/css', express.static('./node_modules/bootstrap/dist/css'));
app.use('/js', express.static('./node_modules/bootstrap/dist/js'));

// Adds req.body to any request
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


//sessions need to be added so user stays logged in for a while
//middleware to make every template have {{user}} available if authenticated
app.use((req, res, next) => {
    res.locals.user = req.user || null;
    next();
});


// Dummy PDF process -- future cron jobs (listening for emails from state)


// Attach app to router
app.use(routes);

// Listen for for requests
const server = app.listen(3000, () => {
    console.log('Now listening on port 3000');
});

server.on('connection', socket => {
    socket.setTimeout(10 * 60 * 1000);
});


/*TODO
    - Download CSV parsed file (two different grouping formats)
    - Generate diff off of python executable
    - min and max cash and share values????
    - 3 different CSVs (Original unordered, cash ordered, share ordered)
    - binary tree and search for property IDs
        - test cases
        - compiling down to C
        - executing C
        - parsing property ID directly to save time
    - RUN pip install sortedcontainers to dockerfile and any other python libraries missing
        - add '&& \' backslash to break the line and '&&' to run next linux command if first finished
    - RUN pip install cython???
    - RUN pip install setuptools
    RUN pip install sortedcontainers
    RUN pip install cython
    RUN pip install setuptools
    ----- Under The Right Directory in which setup.py lives -------
    - RUN python setup.py build_ext --inplace

    -compile down to c code with cython
    -progress bar (both zip file sizes added)
    -download 
    - deploy
*/