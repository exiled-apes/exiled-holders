.DEFAULT_GOAL := publish

RPC_HOST ?= https://api.mainnet-beta.solana.com
CHILL ?= 50

clean:
	@rm -fr build *-holders.log

install:
	@npm install

build/main.js: install
	@npm run build

dape-token-addresses.log:
	@curl --silent -L https://gist.githubusercontent.com/levicook/df930a87845f27d800822d2904f21407/raw/976d967c0864f72945467ae88a7ff4b25cbdffe1/dape-mints.json | jq -r '.[]' | sponge dape-token-addresses.log

xape-token-addresses.log:
	@curl --silent -L https://gist.githubusercontent.com/levicook/36f1eb759fa8a3529c7d6ada2c7e5be9/raw/5494a4d94a17f802c3a63783f65e4d7e913d0b0f/exiled-token-addresses.log | sponge xape-token-addresses.log

dape-holders.log: build/main.js dape-token-addresses.log
	@node build/main.js -t dape-token-addresses.log -e $(RPC_HOST) -c $(CHILL) | tee dape-holders.log

xape-holders.log: build/main.js xape-token-addresses.log
	@node build/main.js -t xape-token-addresses.log -e $(RPC_HOST) -c $(CHILL) | tee xape-holders.log

publish:
    ## TODO validate 719 lines before pushing xape-holders.log
    ## TODO validate 10k lines before pushing dape-holders.log
	@gh gist create dape-holders.log xape-holders.log