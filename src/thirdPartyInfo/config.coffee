angular.module('storage.gdpr')


.config (storageSettingsProvider)->
    GA = [
        {
            key: '_ga'
            provider: 'google.com'
            purpose: 'Used to distinguish users'
            expiry: '2 years'
            type: 'HTTP cookie'
        },{
            key: '_gid'
            provider: 'google.com'
            purpose: '24 hours'
            expiry: 'Used to distinguish users'
            type: 'HTTP cookie'
        },{
            key: '_gat'
            provider: 'google.com'
            purpose: 'Used to throttle request rate. If Google Analytics is deployed via Google Tag Manager, this cookie will be named _dc_gtm_<property-id>'
            expiry: '1 minute'
            type: 'HTTP cookie'
        },{
            key: 'AMP_TOKEN'
            provider: 'google.com'
            purpose: 'Contains a token that can be used to retrieve a Client ID from AMP Client ID service. Other possible values indicate opt-out, inflight request or an error retrieving a Client ID from AMP Client ID service'
            expiry: '30 seconds to 1 year'
            type: 'HTTP cookie'
        },{
            key: '_gac_<property-id>'
            provider: 'google.com'
            purpose: 'Contains campaign related information for the user'
            expiry: '90 days'
            type: 'HTTP cookie'
        },{
            key: '__utma'
            provider: 'google.com'
            purpose: 'Used to distinguish users and sessions. The cookie is created when the javascript library executes and no existing __utma cookies exists. The cookie is updated every time data is sent to Google Analytics'
            expiry: '2 years from set/update'
            type: 'HTTP cookie'
        },{
            key: '__utmt'
            provider: 'google.com'
            purpose: 'Used to throttle request rate'
            expiry: '10 minutes'
            type: 'HTTP cookie'
        },{
            key: '__utmb'
            provider: 'google.com'
            purpose: 'Used to determine new sessions/visits. The cookie is created when the javascript library executes and no existing __utmb cookies exists. The cookie is updated every time data is sent to Google Analytics'
            expiry: '30 mins from set/update'
            type: 'HTTP cookie'
        },{
            key: '__utmz'
            provider: 'google.com'
            purpose: 'Stores the traffic source or campaign that explains how the user reached your site. The cookie is created when the javascript library executes and is updated every time data is sent to Google Analytics'
            expiry: '6 months from set/update'
            type: 'HTTP cookie'
        },{
            key: '__utmv'
            provider: 'google.com'
            purpose: 'Used to store visitor-level custom variable data'
            expiry: '2 years from set/update'
            type: 'HTTP cookie'
        },{
            key: '__utmx'
            provider: 'google.com'
            purpose: "Used to determine a user's inclusion in an experiment"
            expiry: '18 months'
            type: 'HTTP cookie'
        },{
            key: '__utmxx'
            provider: 'google.com'
            purpose: 'Used to determine the expiry of experiments a user has been included in'
            expiry: '18 months'
            type: 'HTTP cookie'
        },{
            key: '_gaexp'
            provider: 'google.com'
            purpose: "Used to determine a user's inclusion in an experiment and the expiry of experiments a user has been included in"
            expiry: 'Depends on the length of the experiment but typically 90 days'
            type: 'HTTP cookie'
        }
    ]
    jivosite = [
        {
            key: 'jv_enter_ts_${jivo_visitor_id}'
            provider: 'jivochat.com'
            purpose: 'First visit to the website'
            expiry: '12 hours from set/update'
            type: 'HTTP cookie'
        },{
            key: 'jv_visits_count_${jivo_visitor_id}'
            provider: 'jivochat.com'
            purpose: 'Number of visits to the website'
            expiry: '12 hours from set/update'
            type: 'HTTP cookie'
        },{
            key: 'jv_pages_count_${jivo_visitor_id}'
            provider: 'jivochat.com'
            purpose: 'Number of pages viewed'
            expiry: '12 hours from set/update'
            type: 'HTTP cookie'
        },{
            key: 'jv_refer_${jivo_visitor_id}'
            provider: 'jivochat.com'
            purpose: 'Source of entry to the website'
            expiry: '12 hours from set/update'
            type: 'HTTP cookie'
        },{
            key: 'jv_utm_${jivo_visitor_id}'
            provider: 'jivochat.com'
            purpose: 'ID of the marketing campaign of the visit'
            expiry: '12 hours from set/update'
            type: 'HTTP cookie'
        },{
            key: 'jv_invitation_time_${jivo_visitor_id}'
            provider: 'jivochat.com'
            purpose: 'Time of appearance of proactive invitation'
            expiry: '12 hours from set/update'
            type: 'HTTP cookie'
        },{
            key: 'jv_country_${jivo_visitor_id}'
            provider: 'jivochat.com'
            purpose: 'Country of the visitor'
            expiry: '12 hours from set/update'
            type: 'HTTP cookie'
        },{
            key: 'jv_city_${jivo_visitor_id}'
            provider: 'jivochat.com'
            purpose: 'City of the visitor'
            expiry: '12 hours from set/update'
            type: 'HTTP cookie'
        },{
            key: 'jv_close_time_${jivo_visitor_id}'
            provider: 'jivochat.com'
            purpose: 'Time the widget was closed'
            expiry: '12 hours from set/update'
            type: 'HTTP cookie'
        },{
            key: 'jv_cw_timer_${jivo_visitor_id}'
            provider: 'jivochat.com'
            purpose: 'Time the callback request was initiated'
            expiry: '12 hours from set/update'
            type: 'HTTP cookie'
        },{
            key: 'jv_callback_ping_response_${jivo_visitor_id}'
            provider: 'jivochat.com'
            purpose: 'Cash of callback backend script response'
            expiry: '12 hours from set/update'
            type: 'HTTP cookie'
        },{
            key: 'jv_use_lp_${jivo_visitor_id}'
            provider: 'jivochat.com'
            purpose: 'Flag that enables long_pooling'
            expiry: '12 hours from set/update'
            type: 'HTTP cookie'
        },{
            key: 'jv_mframe_protected_${jivo_visitor_id}'
            provider: 'jivochat.com'
            purpose: 'Indication if iframe is forbidden'
            expiry: '12 hours from set/update'
            type: 'HTTP cookie'
        },{
            key: 'jv_ab_test_group_${jivo_visitor_id}'
            provider: 'jivochat.com'
            purpose: 'a/b testing group flag'
            expiry: '12 hours from set/update'
            type: 'HTTP cookie'
        }
    ]
    yandexMetrica = [
        {
            key: '_ym_isad'
            provider: 'yandex.com'
            purpose: 'Used to determine if a visitor has ad blockers'
            expiry: '2 days'
            type: 'HTTP cookie'
        },{
            key: '_ym_uid'
            provider: 'yandex.com'
            purpose: 'Used for identifying site users'
            expiry: '1 year'
            type: 'HTTP cookie'
        },{
            key: '_ym_d'
            provider: 'yandex.com'
            purpose: "Date of the user's first site session"
            expiry: '1 year'
            type: 'HTTP cookie'
        },{
            key: 'yabs-sid'
            provider: 'yandex.com'
            purpose: 'Session ID'
            expiry: 'Until the session ends'
            type: 'HTTP cookie'
        },{
            key: '_ym_debug'
            provider: 'yandex.com'
            purpose: 'Indicates that debug mode is active'
            expiry: 'Until the session ends'
            type: 'HTTP cookie'
        },{
            key: '_ym_mp2_substs'
            provider: 'yandex.com'
            purpose: 'Used for Target Call'
            expiry: 'Until the session ends'
            type: 'HTTP cookie'
        },{
            key: 'i'
            provider: 'yandex.com'
            purpose: 'Used for identifying site users'
            expiry: '1 year'
            type: 'HTTP cookie'
        },{
            key: 'yandexuid'
            provider: 'yandex.com'
            purpose: 'Used for identifying site users'
            expiry: '1 year'
            type: 'HTTP cookie'
        },{
            key: 'usst'
            provider: 'yandex.com'
            purpose: 'Stores auxiliary information for syncing site user IDs between different Yandex domains'
            expiry: '1 year'
            type: 'HTTP cookie'
        },{
            key: '_ym_visorc_*'
            provider: 'yandex.com'
            purpose: 'Allows Session Replay to function correctly'
            expiry: '30 minutes'
            type: 'HTTP cookie'
        },{
            key: '_ym_hostIndex'
            provider: 'yandex.com'
            purpose: 'Limits the number of requests'
            expiry: '1 day'
            type: 'HTTP cookie'
        },{
            key: '_ym_mp2_track'
            provider: 'yandex.com'
            purpose: 'Used for Target Call'
            expiry: '30 days'
            type: 'HTTP cookie'
        },{
            key: 'zz'
            provider: 'yandex.com'
            purpose: 'Used for identifying site users'
            expiry: '90 days'
            type: 'HTTP cookie'
        }
    ]

    storageSettingsProvider.registerThirdPartyServiceLiteral('googleAnalytics', {
        type: 'googleAnalytics'
        name: 'Google Analytics'
        cookies: GA
    })
    storageSettingsProvider.registerThirdPartyServiceLiteral('googleTagManager', {
        type: 'googleTagManager'
        name: 'Google Tag Manager'
        cookies: GA
    })
    storageSettingsProvider.registerThirdPartyServiceLiteral('jivosite', {
        type: 'jivosite'
        name: 'Jivochat'
        cookies: jivosite
    })
    storageSettingsProvider.registerThirdPartyServiceLiteral('yandexMetrica', {
        type: 'yandexMetrica'
        name: 'Yandex Metrica'
        cookies: yandexMetrica
    })
    storageSettingsProvider.registerThirdPartyServiceLiteral('facebookPixel', {
        type: 'facebookPixel'
        name: 'Facebook Pixel'
        description: """Unfortunately, facebook.com does not provide comprehensive information about the created and tracked cookies and keys in localStorage. For general information, you can follow this <a href='https://www.facebook.com/policies/cookies/' target='_blank'>link</a>."""
    })
    storageSettingsProvider.registerThirdPartyServiceLiteral('chatflow', {
        type: 'chatflow'
        name: 'chatflow.io'
        description: """Unfortunately, chatflow.io does not provide comprehensive information about the created and tracked cookies and keys in localStorage. For general information, you can follow this <a href='https://chatflow.io/' target='_blank'>link</a>."""
    })
    return
