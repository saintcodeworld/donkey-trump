// ============================================================
// Donkey Kong JS - Terms of Service Modal
// Displays and manages Terms of Service acceptance
// ============================================================

const TermsOfService = (() => {
    let modal = null;
    let hasAccepted = false;
    let onAcceptCallback = null;

    const TERMS_VERSION = '1.0';

    function init() {
        checkAcceptanceStatus();
        createModal();
        setupEventListeners();
    }

    function checkAcceptanceStatus() {
        const accepted = localStorage.getItem('termsAccepted');
        const version = localStorage.getItem('termsVersion');
        hasAccepted = accepted === 'true' && version === TERMS_VERSION;
    }

    function createModal() {
        modal = document.createElement('div');
        modal.id = 'termsModal';
        modal.innerHTML = `
            <div id="termsModalContent">
                <div id="termsHeader">
                    <h3>TERMS OF SERVICE</h3>
                </div>
                <div id="termsBody">
                    <div class="terms-section">
                        <h4>1. ACCEPTANCE OF TERMS</h4>
                        <p>By accessing and playing Donkey Trump, you accept and agree to be bound by these Terms of Service. If you do not agree, please do not use this service.</p>
                    </div>

                    <div class="terms-section">
                        <h4>2. GAME DESCRIPTION</h4>
                        <p>Donkey Trump is a play-to-earn arcade game where players can earn Solana (SOL) cryptocurrency by completing game rounds. Rewards are automatically distributed to player wallets.</p>
                    </div>

                    <div class="terms-section">
                        <h4>3. WALLET & CRYPTOCURRENCY</h4>
                        <p>• You are responsible for securing your wallet and private keys<br>
                        • Lost or stolen private keys cannot be recovered<br>
                        • We are not responsible for loss of funds due to user error<br>
                        • Cryptocurrency values fluctuate and may result in financial loss<br>
                        • You must comply with local laws regarding cryptocurrency</p>
                    </div>

                    <div class="terms-section">
                        <h4>4. REWARDS & PAYOUTS</h4>
                        <p>• Rewards are subject to availability of treasury funds<br>
                        • Reward amounts may change without notice<br>
                        • We reserve the right to modify or discontinue rewards<br>
                        • Fraudulent activity will result in account termination<br>
                        • Minimum age requirement: 18 years or legal age in your jurisdiction</p>
                    </div>

                    <div class="terms-section">
                        <h4>5. PROHIBITED ACTIVITIES</h4>
                        <p>You may not:<br>
                        • Use bots, scripts, or automated tools<br>
                        • Exploit bugs or glitches for unfair advantage<br>
                        • Create multiple accounts to farm rewards<br>
                        • Engage in any form of cheating or manipulation<br>
                        • Harass other players or use offensive language</p>
                    </div>

                    <div class="terms-section">
                        <h4>6. INTELLECTUAL PROPERTY</h4>
                        <p>This game is a fan-made tribute to the original Donkey Kong arcade game. All trademarks and copyrights belong to their respective owners. This is a non-commercial educational project.</p>
                    </div>

                    <div class="terms-section">
                        <h4>7. DISCLAIMER OF WARRANTIES</h4>
                        <p>THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. We do not guarantee uninterrupted service, error-free operation, or that rewards will always be available.</p>
                    </div>

                    <div class="terms-section">
                        <h4>8. LIMITATION OF LIABILITY</h4>
                        <p>We are not liable for any damages arising from use of this service, including but not limited to loss of funds, data, or profits. Use at your own risk.</p>
                    </div>

                    <div class="terms-section">
                        <h4>9. PRIVACY</h4>
                        <p>• We store your public wallet address and game statistics<br>
                        • Chat messages are stored and visible to other players<br>
                        • We do not collect personal identifying information<br>
                        • Your private keys are stored locally in your browser only</p>
                    </div>

                    <div class="terms-section">
                        <h4>10. MODIFICATIONS</h4>
                        <p>We reserve the right to modify these terms at any time. Continued use of the service constitutes acceptance of modified terms.</p>
                    </div>

                    <div class="terms-section">
                        <h4>11. GOVERNING LAW</h4>
                        <p>These terms are governed by applicable laws. Any disputes shall be resolved through binding arbitration.</p>
                    </div>

                    <div class="terms-section">
                        <h4>12. CONTACT</h4>
                        <p>For questions or concerns about these terms, please contact us through our official channels.</p>
                    </div>

                    <div class="terms-updated">
                        Last Updated: March 15, 2026 • Version ${TERMS_VERSION}
                    </div>
                </div>
                <div id="termsFooter">
                    <label class="terms-checkbox">
                        <input type="checkbox" id="termsAgree">
                        <span>I have read and agree to the Terms of Service</span>
                    </label>
                    <div class="terms-buttons">
                        <button id="termsDecline">DECLINE</button>
                        <button id="termsAccept" disabled>ACCEPT & CONTINUE</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    function setupEventListeners() {
        const agreeCheckbox = document.getElementById('termsAgree');
        const acceptBtn = document.getElementById('termsAccept');
        const declineBtn = document.getElementById('termsDecline');

        agreeCheckbox.addEventListener('change', (e) => {
            acceptBtn.disabled = !e.target.checked;
        });

        acceptBtn.addEventListener('click', accept);
        declineBtn.addEventListener('click', decline);
    }

    function show(onAccept) {
        onAcceptCallback = onAccept;
        modal.style.display = 'flex';
        document.getElementById('termsAgree').checked = false;
        document.getElementById('termsAccept').disabled = true;
    }

    function hide() {
        modal.style.display = 'none';
    }

    function accept() {
        localStorage.setItem('termsAccepted', 'true');
        localStorage.setItem('termsVersion', TERMS_VERSION);
        hasAccepted = true;
        hide();
        if (onAcceptCallback) {
            onAcceptCallback();
        }
    }

    function decline() {
        hide();
        alert('You must accept the Terms of Service to use this application.');
    }

    function requiresAcceptance() {
        return !hasAccepted;
    }

    function showTermsLink() {
        modal.style.display = 'flex';
    }

    return { init, show, hide, requiresAcceptance, showTermsLink };
})();
