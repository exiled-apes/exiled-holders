.DEFAULT_GOAL := publish

RPC_HOST ?= https://api.mainnet-beta.solana.com
CHILL ?= 50

clean:
	@rm -fr build holders.log

install:
	@npm install

build/main.js: install
	@npm run build

exiled-token-addresses.log:
	@curl -LO https://gist.githubusercontent.com/levicook/36f1eb759fa8a3529c7d6ada2c7e5be9/raw/5494a4d94a17f802c3a63783f65e4d7e913d0b0f/exiled-token-addresses.log

exiled-holders.log: build/main.js exiled-token-addresses.log
	@node build/main.js --rpc-host=$(RPC_HOST) --chill=$(CHILL) | tee exiled-holders.log

publish:
    ## TODO validate 719 lines before pushing
	@gh gist create exiled-holders.log || echo "Did you run `make exiled-holders.log` successfully?"