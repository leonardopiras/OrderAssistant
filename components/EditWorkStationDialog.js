
<script src="http://localhost:8097"></script>
import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    NativeModules, LogBox
} from 'react-native';



import styles from '@styles/DefaultStyles';
import colors from '@styles/Colors';
import CustomDialog from '@components/CustomDialog';
import OATextInput from "@components/OATextInput";
import ItemCatsInput from '@components/ItemCatsInput';

const { ManageConfigurationsModule } = NativeModules;

export default function EditWorkStationDialog({
    onConfirm, onRequestClose, isVisible, workStationInfo, sessionCats
}) {

    const [name, setName] = useState("");
    const [cats, setCats] = useState(workStationInfo.affectedCats);


    const [sentences, setSentences] = useState({
        confirm: "Conferma",
        cancel: "Annulla",
        delete: "Elimina",
        editWorkStation: "Modifica postazione",
        name: "Nome",
        handledCats: "Categorie gestite"

    });

    useEffect(() => {
        setName(workStationInfo.workStationName);
        setCats(workStationInfo.affectedCats);
    }, []);


    const deleteWorkstation = () => {
        const nameOK = name && name.length > 0;
        if (nameOK)
            onConfirm(name, []);
    }



    const onPressPrimaryBtn = () => {
        const nameOK = name && name.length > 0;
        if (nameOK)
            onConfirm(name, cats);
    }



    return (
        <CustomDialog
            title={sentences.editWorkStation}
            primaryBtn={sentences.confirm}
            secondaryBtn={sentences.cancel}
            ternaryBtn={sentences.delete}
            onPressPrimaryBtn={onPressPrimaryBtn}
            onPressSecondaryBtn={onRequestClose}
            onPressTernaryBtn={deleteWorkstation}
            isVisible={isVisible}
            onRequestClose={onRequestClose}
            height={"60%"}
        >
            <OATextInput
                value={name}
                setValue={setName}
                label={sentences.name}
                showError={false}
                errorMsg={false}
                style={myStyles.inputs}
            />
            {cats ? 
            <ItemCatsInput
                label={sentences.handledCats}
                itemCats={cats}
                setItemCats={setCats}
                style={{flex: 1}}
                sessionCats={sessionCats}
            /> : null}
        </CustomDialog>
    );

}

const myStyles = StyleSheet.create({

});