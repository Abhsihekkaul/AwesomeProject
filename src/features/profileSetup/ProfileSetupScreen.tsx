import React, { useState } from "react";
import ProfileNameScreen from "./steps/ProfileNameScreen";
import HealthJourneyScreen from "./steps/HealthJourneyScreen";
import PrivacySafetyScreen from "./steps/PrivacySafetyScreen";

const ProfileSetupScreen = ({ navigation }: any) => {
    const [step, setStep] = useState(0);

    const [name, setName] = useState("Sarah");
    const [selected, setSelected] = useState<string[]>(["Fibromyalgia"]);
    const [publicProfile, setPublicProfile] = useState(false);
    const [showConditions, setShowConditions] = useState(true);
    const [anonymousPosts, setAnonymousPosts] = useState(false);

    const handleFinish = () => {
        navigation.reset({
            index: 0,
            routes: [{ name: "MainTabs" }],
        });
    };

    return (
        <>
            {step === 0 && (
                <ProfileNameScreen
                    navigation={navigation}
                    name={name}
                    setName={setName}
                    onContinue={() => setStep(1)}
                />
            )}

            {step === 1 && (
                <HealthJourneyScreen
                    navigation={navigation}
                    selected={selected}
                    setSelected={setSelected}
                    onBack={() => setStep(0)}
                    onContinue={() => setStep(2)}
                />
            )}

            {step === 2 && (
                <PrivacySafetyScreen
                    navigation={navigation}
                    publicProfile={publicProfile}
                    setPublicProfile={setPublicProfile}
                    showConditions={showConditions}
                    setShowConditions={setShowConditions}
                    anonymousPosts={anonymousPosts}
                    setAnonymousPosts={setAnonymousPosts}
                    onBack={() => setStep(1)}
                    onFinish={handleFinish}
                />
            )}
        </>
    );
};

export default ProfileSetupScreen;