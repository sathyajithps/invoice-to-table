const path = require('path');
const fs = require('fs');
const pdfExtractor = require('pdf-table-extractor');
const pdfPrinter = require('pdfmake');
const _ = require('lodash');

const invoicePath = path.resolve('./invoice.pdf');

const fonts = {
    Roboto: {
        normal: 'product-sans/psn.ttf',
        bold: 'product-sans/psb.ttf',
        italics: 'product-sans/psi.ttf',
        bolditalics: 'product-sans/psbi.ttf'
    }
};

const formatTable = (table) => {
    const flushedArray = [];
    table.forEach((row, index) => {
        flushedArray.push(row.filter((val) => val != ''));
    });
    let formattedTableArray = [];
    flushedArray.forEach((row, index) => {
        formattedTableArray.push(
            row.map((val) => {
                if (val.includes('\n')) {
                    _.replace(val, /(\r\n|\n|\r)/gm, ' ');
                }
                return val.trim();
            })
        );
    });
    return formattedTableArray;
};

const tableFormatter = (fta) => {
    const body = [['Company', 'Invoice', 'Date', 'TRN', 'Amount']];
    const invoice = fta[0][0].split(':')[1];
    const date = fta[0][1].split(':')[1].trim();
    const company = fta[1][0];
    const TRN = fta[1][1].split('-')[1];
    const indexOfTotalAmountString = fta[3][1].indexOf('Total amount');
    const stringLength = fta[3][1].length;
    const stringStartingWithTotalamount = fta[3][1].slice(
        indexOfTotalAmountString,
        stringLength
    );
    const indexOfSlash = stringStartingWithTotalamount.indexOf('/');
    const amount = stringStartingWithTotalamount.slice(13, indexOfSlash);
    const row = [company, invoice, date, TRN, amount];
    body.push(row);
    return body;
};

const success = (successMsg) => {
    const table = successMsg.pageTables[0].tables;
    const formattedTableArray = formatTable(table);
    const printer = new pdfPrinter(fonts);
    const docDef = {
        content: [
            {
                layout: 'lightHorizontalLines', // optional
                table: {
                    // headers are automatically repeated if the table spans over multiple pages
                    // you can declare how many rows should be treated as headers
                    headerRows: 1,
                    widths: ['*', 'auto', 100, '*', '*'],

                    body: tableFormatter(formattedTableArray)
                }
            }
        ]
    };
    const pdf = printer.createPdfKitDocument(docDef);
    pdf.pipe(fs.createWriteStream('extracted.pdf'));
    pdf.end();
};

const error = (errorMsg) => {
    console.log('error');
};
pdfExtractor(invoicePath, success, error);
