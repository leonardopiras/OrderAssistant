<script src="http://localhost:8097"></script>
import React, { useState, useEffect } from 'react';
import {
    Pressable,
    StyleSheet,
    View,
} from 'react-native';


import styles from '@styles/DefaultStyles';
import colors from "@styles/Colors";


import { ViewPager } from '@ui-kitten/components';
import Icon from 'react-native-vector-icons/Entypo'
import Animated, { withSpring, useAnimatedStyle } from 'react-native-reanimated';
import OAButton from '@components/OAButton';



// Ricorda width e height 100% container
// Figli hanno gia container
export default function OAViewPager({
     selectedIndx, 
    setSelectedIndx, showIndicator, 
    style, pageStyle,
    UI_1, UI_2, UI_3, UI_4, UI_5, 
    numOfPages,
    showBtns, trySaveAndExit, goBack,
    swipeEnabled,
}) {

    const [flagIndicatorArraySupport, setFlagIndicatorArray] = useState([]); 
    const [isFirstPage, setIsFirstPage] = useState(true);
    const [isLastPage, setIsLastPage] = useState(false);
    const [continueBtnProps, setContinueBtnProps] = useState({title: "", icon: "", color: ""})
    const [backBtnProps, setBackBtnProps] = useState({title: "", icon: "", color: ""})

    const [sentences, setSentences] = useState({
        save: "Salva",
        continue: "Continua",
        goBack: "Indietro",
        cancel: "Annulla",
      });

    useEffect(() => {
        const arr = new Array(numOfPages).fill(false).map((el,indx) => {return (indx === 0)})
        setFlagIndicatorArray(arr);
    }, []);


    useEffect(() => {
        setFlagIndicatorArray(p => {
            return p.map((el,indx) => {return indx === selectedIndx})
        });
        if (showBtns) 
            changeBtns(selectedIndx);
       
    }, [selectedIndx]);

    const changeBtns = (selectedIndx) => {
        const isFirst = selectedIndx === 0;
        const isLast = selectedIndx === (numOfPages-1);
        setIsFirstPage(isFirst)
        setIsLastPage(isLast);
    
        setContinueBtnProps({
          title: isLast ? sentences.save : sentences.continue,
          icon:  isLast ? "content-save-outline" : "eye-arrow-right-outline",
          color: isLast ? colors.greenBtn : colors.color_3
        });
        setBackBtnProps({
          title: isFirst ? sentences.cancel : sentences.goBack,
          icon:  isFirst ? "block-helper" : "eye-arrow-left",
          color: isFirst ? colors.redBtn : ""
        });
    }



    const handleContinue = () => {
        if (isLastPage) 
          trySaveAndExit();
        else 
          setSelectedIndx(p => {return (p+1)})
      }
    
      const handleGoBack = () => {
        if (selectedIndx === 0) {
          goBack();
        }
        else 
          setSelectedIndx(p => {return (p-1)});
      }
    
      const changeIndicatorState = (selectedIndex) => {
        setSelectedIndx(selectedIndex);
    }

    
    const UIIndicator = (showIndicator) ? (
        <View style={myStyles.viewPgrLayout.indicator.container}>
            {flagIndicatorArraySupport.map((selected, indx) => {
                const style = { transform: [{ scale: selected ? 1.5 : 1}],  };
                return (
                    <Animated.View
                        style={style}
                        key={indx}
                    >
                        <Icon
                            style={[{ marginHorizontal: 5 }]}
                            name={"controller-record"}
                            color={"white"}
                            size={10} />
                    </Animated.View>
                );

            })}

       
        </View>
    ) : null;

    const UIBottomBtn = (title, icon, color, onPress) => {
        return (
          <OAButton
          isHorizontal={true}
          title={title}
          icon={icon}
          onPress={onPress}
          iconProps={{ size: 20, style: { marginHorizontal: 5 } }}
          style={{backgroundColor: color, marginStart: 10}}
        />
        );
      }

    const UIBottomBtns = (showBtns) ? (
        <View style={myStyles.bottomBtns.container}>
                {UIBottomBtn(backBtnProps.title, backBtnProps.icon, backBtnProps.color, handleGoBack)}
                {UIBottomBtn(continueBtnProps.title, continueBtnProps.icon, continueBtnProps.color, handleContinue)}

            </View>
    ) : null;

    const UIPage = (child) => {
        return child ? (
            <View style={[myStyles.viewPgrLayout.child,pageStyle]}>{child}</View>
        ) : null;
    }

    return (
        <View 
        style={[myStyles.container, style]}>
            {UIIndicator}
            <ViewPager
                swipeEnabled={typeof swipeEnabled === "boolean" ? swipeEnabled : true}
                style={[myStyles.viewPgrLayout.viewPager]}
                selectedIndex={selectedIndx}
                onSelect={(indx) => setSelectedIndx(indx)}
                shouldLoadComponent={indx => Math.abs(indx - selectedIndx) <= 1}
            >
                {UIPage(UI_1)}
                {UIPage(UI_2)}
                {UIPage(UI_3)}
                {UIPage(UI_4)}
                {UIPage(UI_5)}
            </ViewPager>
            {UIBottomBtns}
        </View>
    );
}


const myStyles = StyleSheet.create({
    container: {
        width: "100%",
        flex: 1
    },
    viewPgrLayout: {
        indicator: {
            container: {
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: colors.color_2,
                height: 30,
                width: "100%"
            }
        },
        child: {
            flex: 1,
            width: "100%",
            height: "100%"
        },
        viewPager: {
            width: "100%",
            flex: 1
        }
    },
    bottomBtns: {
        container: {
          alignSelf: "stretch",
          flexWrap: "wrap",
          justifyContent: "flex-end",
          flexDirection: "row",
          height: 50, 
          marginHorizontal: 30
        },
        btn: {
          marginStart: 10
        }
      },
    
}); 
