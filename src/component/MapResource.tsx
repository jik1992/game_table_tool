// tslint:disable no-console
// tslint:disable jsx-no-lambda
import React, {useRef} from 'react';
import _ from "lodash";

import "pikaday/css/pikaday.css";
import 'handsontable/dist/handsontable.full.min.css';

import {registerAllModules} from 'handsontable/registry';
import {registerLanguageDictionary, zhCN} from 'handsontable/i18n';

registerLanguageDictionary(zhCN);

registerAllModules();

type IProps = {};

type IState = {};


export class MapResource extends React.PureComponent<IProps, IState> {

    state: IState = {};

    componentDidMount() {
    }

    componentWillUnmount() {
    }


    render() {
        return <>
            1
        </>
    }


}


